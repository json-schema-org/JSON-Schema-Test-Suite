#!/bin/bash

echo "Running test suite with implementation ${1}"

COMMAND=$(jq -r ".[] | select(.\"docker-image\"==\"${1}\") | .command" /report/implementations.json)

if [[ "${COMMAND}" -eq "" ]]
then
    echo "Implementation either not found or not configured with a command to execute"
    exit 1
fi

for d in ../tests/*/
do
    specVersion=$(basename $d)
    echo "$specVersion"
    for f in $d* # $d contains the ending /
    do
        filename=$(basename $f)
        echo "  ${filename%%.*}"
        scenarioIndex=0
        jq -cr '.[]' < $f | while read j
        do
            scenario=$(echo $j | jq -r '.description')
            schemaUri="$f#/$scenarioIndex/schema"
            caseIndex=0
            echo "    $scenario"
            echo $j | jq -c '.tests[]' | while read c
            do
                case=$(echo $c | jq -r '.description')
                instanceUri="$f#/$scenarioIndex/tests/$caseIndex/data"
                case "$(echo $c | jq '.valid')" in
                    true) expected=0 ;;
                    false) expected=255 ;;
                esac

                echo "      $case"
                ${COMMAND} --schema $schemaUri --instance $instanceUri --spec-version $specVersion
                evaluated=$?

                if [[ $evaluated -ne $expected ]]
                then
                    echo --schema $schemaUri --instance $instanceUri --spec-version $specVersion / $expected
                    echo $evaluated
                    case $evaluated in
                        255) message="did not validate but should have" ;;
                        0) message="validated but should not have" ;;
                        1) message="an error occurred" ;;
                        2) message="not supported" ;;
                    esac
                    echo $message
                fi
                ((caseIndex++))
            done
            ((scenarioIndex++))
        done

        exit 0
    done
done
