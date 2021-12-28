#!/bin/sh

for d in ../tests/*/
do
    specVersion=$(basename $d)
    for f in $d* # $d contains the ending /
    do
        echo "$f"
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
                    true) expected=0 ;;
                    false) expected=127 ;;  # bash seems to interpret a -1 exit code as 127
                esac

                ${1} --schema $schemaUri --instance $instanceUri --spec-version $specVersion
                evaluated=$?

                if [[ $evaluated -ne $expected ]]
                then
                    echo --schema $schemaUri --instance $instanceUri --spec-version $specVersion / $expected
                    echo $evaluated
                    case $evaluated in
                        127) message="did not validate but should have" ;;
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
    done
done
