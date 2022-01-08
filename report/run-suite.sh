#!/bin/bash

echo "Running test suite with implementation ${1}"

command=$(jq -r ".[] | select(.\"docker-image\"==\"${1}\") | .command" /report/implementations.json)
versions=$(jq -r ".[] | select(.\"docker-image\"==\"${1}\") | .versions" /report/implementations.json)
output="/output/result.yml"

sed -e "s~\${IMPLEMENTATION}~${1}~" /report/report-template.yml > ${output}

if [[ "${command}" -eq "" ]]
then
    echo "Implementation either not found or not configured with a command to execute"
    exit 1
fi

for d in ../tests/*/
do
    specVersion=$(basename $d)

    if ! [[ ${versions[@]} =~ $specVersion ]]
    then
        # record that the draft isn't supported
        continue
    fi

    for f in $d* # $d contains the ending /
    do
        filename=$(basename $f)
        scenarioIndex=0
        jq -cr '.[]' < $f | while read j
        do
            scenario=$(echo $j | jq -r '.description')
            schemaUri="$f#/$scenarioIndex/schema"
            caseIndex=0
            echo $j | jq -c '.tests[]' | while read c
            do
                case=$(echo $c | jq -r '.description')
                instanceUri="$f#/$scenarioIndex/tests/$caseIndex/data"
                case "$(echo $c | jq '.valid')" in
                    true) expected="valid" ;;
                    false) expected="invalid" ;;
                esac

                ${command} --schema $schemaUri --instance $instanceUri --spec-version $specVersion
                evaluated=$?

                case $evaluated in
                    255) result="invalid" ;;
                    0) result="valid" ;;
                    1) result="error" ;;
                    2) result="unsupported" ;;
                esac

                echo "  - draft: ${specVersion}" >> $output
                echo "    file: ${filename%%.*}" >> $output
                echo "    scenario: ${scenario}" >> $output
                echo "    case: ${case}" >> $output
                echo "    expected: ${expected}" >> $output
                echo "    result: ${result}" >> $output

                ((caseIndex++))
            done
            ((scenarioIndex++))
        done
    done
done
